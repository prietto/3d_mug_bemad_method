import { render, screen } from '@testing-library/react'
import SplitScreenLayout from './SplitScreenLayout'

describe('SplitScreenLayout', () => {
  it('renders left and right components', () => {
    render(
      <SplitScreenLayout
        leftComponent={<div>Left Content</div>}
        rightComponent={<div>Right Content</div>}
      />
    )

    expect(screen.getByText('Left Content')).toBeInTheDocument()
    expect(screen.getByText('Right Content')).toBeInTheDocument()
  })

  it('applies correct ARIA labels to sections', () => {
    render(
      <SplitScreenLayout
        leftComponent={<div>Left Content</div>}
        rightComponent={<div>Right Content</div>}
      />
    )

    expect(screen.getByLabelText('3D Mug Designer')).toBeInTheDocument()
    expect(screen.getByLabelText('Contact Form')).toBeInTheDocument()
  })

  it('applies 60/40 split ratio by default', () => {
    const { container } = render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
      />
    )

    const leftSection = screen.getByLabelText('3D Mug Designer')
    const rightSection = screen.getByLabelText('Contact Form')

    expect(leftSection).toHaveClass('lg:w-3/5')
    expect(rightSection).toHaveClass('lg:w-2/5')
  })

  it('applies full width on mobile', () => {
    render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
      />
    )

    const leftSection = screen.getByLabelText('3D Mug Designer')
    const rightSection = screen.getByLabelText('Contact Form')

    expect(leftSection).toHaveClass('w-full')
    expect(rightSection).toHaveClass('w-full')
  })

  it('applies responsive flex direction', () => {
    const { container } = render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
      />
    )

    const layoutContainer = container.querySelector('div')
    expect(layoutContainer).toHaveClass('flex', 'flex-col', 'lg:flex-row')
  })

  it('applies smooth transitions', () => {
    const { container } = render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
      />
    )

    const layoutContainer = container.querySelector('div')
    const leftSection = screen.getByLabelText('3D Mug Designer')
    const rightSection = screen.getByLabelText('Contact Form')

    expect(layoutContainer).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
    expect(leftSection).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
    expect(rightSection).toHaveClass('transition-all', 'duration-300', 'ease-in-out')
  })

  it('accepts custom split ratio', () => {
    const { container } = render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
        leftWidthPercent={70}
      />
    )

    const leftSection = screen.getByLabelText('3D Mug Designer')
    const rightSection = screen.getByLabelText('Contact Form')

    // Custom widths use inline styles with flex-basis to avoid Tailwind JIT issues
    expect(leftSection).toHaveStyle({ flexBasis: '70%' })
    expect(rightSection).toHaveStyle({ flexBasis: '30%' })
  })

  it('uses semantic section elements', () => {
    render(
      <SplitScreenLayout
        leftComponent={<div>Left</div>}
        rightComponent={<div>Right</div>}
      />
    )

    const sections = screen.getAllByRole('region')
    expect(sections).toHaveLength(2)
  })

  // Story 5.1 AC validation tests
  describe('3D Canvas height constraints (Story 5.1)', () => {
    it('applies min-h-[600px] to left panel for 3D viewport', () => {
      render(
        <SplitScreenLayout
          leftComponent={<div>3D Canvas</div>}
          rightComponent={<div>Form</div>}
        />
      )

      const leftSection = screen.getByLabelText('3D Mug Designer')
      expect(leftSection).toHaveClass('min-h-[600px]')
    })

    it('applies lg:h-screen to left panel for desktop full-height layout', () => {
      render(
        <SplitScreenLayout
          leftComponent={<div>3D Canvas</div>}
          rightComponent={<div>Form</div>}
        />
      )

      const leftSection = screen.getByLabelText('3D Mug Designer')
      expect(leftSection).toHaveClass('lg:h-screen')
    })

    it('ensures responsive layout remains smooth with height constraints', () => {
      render(
        <SplitScreenLayout
          leftComponent={<div>3D Canvas</div>}
          rightComponent={<div>Form</div>}
        />
      )

      const leftSection = screen.getByLabelText('3D Mug Designer')
      // Verify height constraints don't conflict with responsive width classes
      expect(leftSection).toHaveClass('w-full', 'lg:w-3/5', 'min-h-[600px]', 'lg:h-screen')
    })
  })
})