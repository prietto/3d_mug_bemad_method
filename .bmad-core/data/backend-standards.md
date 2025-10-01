# Backend Development Standards

## Architecture Principles

### Hexagonal Architecture Implementation
- **Application Core**: Domain entities, value objects, aggregates, and domain services
- **Primary Ports**: Use cases, commands, queries, and application services  
- **Primary Adapters**: REST controllers, GraphQL resolvers, message handlers
- **Secondary Ports**: Repository interfaces, external service interfaces
- **Secondary Adapters**: Prisma repositories, HTTP clients, message publishers

### Dependency Rules
- Application core must not depend on external frameworks
- All dependencies point inward toward the domain
- Use dependency inversion for all external concerns
- Interfaces defined in application layer, implementations in infrastructure

## Technology Stack Standards

### Core Technologies
- **NestJS**: 10+ with TypeScript and decorators
- **TypeScript**: Strict mode enabled, no `any` types
- **Prisma**: ORM for database operations (no raw queries)
- **Jest**: Unit and integration testing
- **Class-validator**: Request validation and transformation

### Framework Selection Rules
- **Default**: Always use NestJS 10+ with TypeScript
- **Database**: Prisma ORM only - no raw SQL queries allowed
- **Testing**: TDD approach with Jest and Supertest
- **Documentation**: Swagger/OpenAPI for all endpoints

### Development Tools
- **Nx**: MonoRepo management and build system
- **ESLint + Prettier**: Code quality and formatting
- **Husky**: Git hooks for pre-commit validation
- **Winston**: Structured logging
- **Redis**: Caching and message transport

## Domain-Driven Design Standards

### Entity Structure
```typescript
export class UserEntity extends AggregateRoot {
  private constructor(
    public readonly id: UserId,
    private _email: EmailValueObject,
    private _name: NameValueObject,
    private _createdAt: Date,
  ) {
    super();
  }

  static create(props: CreateUserProps): UserEntity {
    const user = new UserEntity(
      UserId.generate(),
      EmailValueObject.create(props.email),
      NameValueObject.create(props.name),
      new Date(),
    );
    user.addDomainEvent(new UserCreatedEvent(user.id));
    return user;
  }

  public updateEmail(newEmail: EmailValueObject): void {
    if (this._email.equals(newEmail)) return;
    this._email = newEmail;
    this.addDomainEvent(new UserEmailUpdatedEvent(this.id, newEmail));
  }

  get email(): EmailValueObject {
    return this._email;
  }
}
```

### Value Object Structure
```typescript
export class EmailValueObject {
  private constructor(private readonly value: string) {
    this.validate(value);
  }

  static create(value: string): EmailValueObject {
    return new EmailValueObject(value);
  }

  private validate(value: string): void {
    if (!value || !this.isValidEmail(value)) {
      throw new InvalidEmailException(value);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  equals(other: EmailValueObject): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

### Repository Interface Pattern
```typescript
export interface UserRepositoryInterface {
  save(user: UserEntity): Promise<UserEntity>;
  findById(id: UserId): Promise<UserEntity | null>;
  findByEmail(email: EmailValueObject): Promise<UserEntity | null>;
  findAll(criteria: FindUsersCriteria): Promise<UserEntity[]>;
  delete(id: UserId): Promise<void>;
}
```

## Use Case Standards

### Use Case Structure
```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepositoryInterface,
    @Inject(EVENT_BUS)
    private readonly eventBus: EventBusInterface,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserResponseDto> {
    // 1. Validate business rules
    await this.validateUserDoesNotExist(command.email);
    
    // 2. Create domain entity
    const user = UserEntity.create({
      email: command.email,
      name: command.name,
    });
    
    // 3. Persist entity
    const savedUser = await this.userRepository.save(user);
    
    // 4. Publish domain events
    await this.eventBus.publishAll(savedUser.getUncommittedEvents());
    savedUser.markEventsAsCommitted();
    
    // 5. Return response DTO
    return UserResponseDto.fromEntity(savedUser);
  }

  private async validateUserDoesNotExist(email: string): Promise<void> {
    const emailVO = EmailValueObject.create(email);
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }
  }
}
```

### Command/Query Structure
```typescript
export class CreateUserCommand {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  readonly name: string;

  @IsOptional()
  @IsString()
  readonly organizationId?: string;
}
```

## Testing Standards

### Testing Strategy
- **Unit Tests**: Domain entities, value objects, use cases
- **Integration Tests**: Repository implementations, external services
- **E2E Tests**: Complete API workflows
- **Contract Tests**: External service integrations

### Test Structure
```typescript
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepositoryInterface>;
  let eventBus: jest.Mocked<EventBusInterface>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: {
            save: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: EVENT_BUS,
          useValue: {
            publishAll: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
    userRepository = module.get(USER_REPOSITORY);
    eventBus = module.get(EVENT_BUS);
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      // Arrange
      const command = new CreateUserCommand();
      command.email = 'test@example.com';
      command.name = 'Test User';

      const expectedUser = UserEntity.create({
        email: command.email,
        name: command.name,
      });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.email).toBe(command.email);
      expect(userRepository.save).toHaveBeenCalledWith(expect.any(UserEntity));
      expect(eventBus.publishAll).toHaveBeenCalled();
    });

    it('should throw error when user already exists', async () => {
      // Arrange
      const command = new CreateUserCommand();
      command.email = 'existing@example.com';
      command.name = 'Test User';

      const existingUser = UserEntity.create({
        email: command.email,
        name: 'Existing User',
      });

      userRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(UserAlreadyExistsException);
    });
  });
});
```

## API Controller Standards

### Controller Structure
```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const command = new CreateUserCommand();
    Object.assign(command, createUserDto);
    return this.createUserUseCase.execute(command);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    const query = new GetUserQuery(id);
    return this.getUserUseCase.execute(query);
  }
}
```

## Database Standards

### Prisma Schema Patterns
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relationships
  orders Order[]

  @@map("users")
}

model Order {
  id       String      @id @default(cuid())
  total    Decimal     @db.Decimal(10, 2)
  status   OrderStatus
  userId   String
  
  // Relationships
  user     User        @relation(fields: [userId], references: [id])
  items    OrderItem[]

  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPED
  DELIVERED
  CANCELLED
}
```

### Repository Implementation
```typescript
@Injectable()
export class PrismaUserRepository implements UserRepositoryInterface {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: UserEntity): Promise<UserEntity> {
    const data = {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
    };

    const savedUser = await this.prisma.user.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });

    return this.toDomain(savedUser);
  }

  async findById(id: UserId): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: id.toString() },
    });

    return user ? this.toDomain(user) : null;
  }

  private toDomain(prismaUser: User): UserEntity {
    return UserEntity.reconstitute({
      id: UserId.create(prismaUser.id),
      email: EmailValueObject.create(prismaUser.email),
      name: NameValueObject.create(prismaUser.name),
      createdAt: prismaUser.createdAt,
    });
  }
}
```

## Security Standards

### Authentication & Authorization
- JWT tokens with proper expiration
- Role-based access control (RBAC)
- Input validation on all endpoints
- Rate limiting for public endpoints
- HTTPS only in production

### Data Protection
- Encrypt sensitive data at rest
- Use environment variables for secrets
- Implement audit logging
- Regular security updates
- OWASP compliance

## Performance Standards

### Database Optimization
- Proper indexing strategies
- Connection pooling
- Query optimization
- Pagination for large datasets
- Database monitoring

### Caching Strategy
- Redis for session data
- Application-level caching
- HTTP caching headers
- CDN for static assets
- Cache invalidation patterns

## MonoRepo Organization

### Shared Libraries Structure
```
libs/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
├── domain-core/
│   ├── base/
│   ├── interfaces/
│   └── exceptions/
└── database/
    ├── base-repository.ts
    ├── transaction.decorator.ts
    └── prisma.service.ts
```

### Service Independence
- Each microservice has its own database
- Shared code through libraries only
- Independent deployment pipelines
- Service-to-service communication via events
- No direct database access between services