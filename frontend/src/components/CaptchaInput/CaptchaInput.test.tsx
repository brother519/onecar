import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaptchaInput, useCaptcha } from '../index';

describe('CaptchaInput', () => {
  const mockOnVerify = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnVerify.mockResolvedValue(true);
  });

  it('应该渲染验证码组件', () => {
    render(
      <CaptchaInput onVerify={mockOnVerify} />
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText('验证')).toBeInTheDocument();
    expect(screen.getByTitle('点击刷新验证码')).toBeInTheDocument();
    expect(screen.getByTitle('音频验证码')).toBeInTheDocument();
  });

  it('应该显示自定义占位符', () => {
    const customPlaceholder = '请输入验证码';
    render(
      <CaptchaInput
        onVerify={mockOnVerify}
        placeholder={customPlaceholder}
      />
    );

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
  });

  it('应该在禁用状态下禁用输入和按钮', () => {
    render(
      <CaptchaInput
        onVerify={mockOnVerify}
        disabled={true}
      />
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByText('验证')).toBeDisabled();
  });

  it('应该应用自定义 className', () => {
    const { container } = render(
      <CaptchaInput
        onVerify={mockOnVerify}
        className="custom-captcha"
      />
    );

    expect(container.querySelector('.custom-captcha')).toBeInTheDocument();
  });

  it('应该处理输入变化', async () => {
    const user = userEvent.setup();
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'ABCD');

    expect(input).toHaveValue('ABCD');
  });

  it('应该在输入长度达到配置长度时自动验证', async () => {
    const user = userEvent.setup();
    
    render(
      <CaptchaInput
        onVerify={mockOnVerify}
        config={{ length: 4 }}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'ABCD');

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(expect.any(String), 'ABCD');
    });
  });

  it('应该处理回车键验证', async () => {
    const user = userEvent.setup();
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'TEST');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(expect.any(String), 'TEST');
    });
  });

  it('应该处理验证按钮点击', async () => {
    const user = userEvent.setup();
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const input = screen.getByRole('textbox');
    const verifyButton = screen.getByText('验证');

    await user.type(input, 'TEST');
    await user.click(verifyButton);

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith(expect.any(String), 'TEST');
    });
  });

  it('应该显示验证成功状态', async () => {
    const user = userEvent.setup();
    
    render(
      <CaptchaInput
        onVerify={mockOnVerify}
        onSuccess={mockOnSuccess}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'CORRECT');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('应该显示验证错误状态', async () => {
    const user = userEvent.setup();
    mockOnVerify.mockRejectedValue(new Error('验证失败'));
    
    render(
      <CaptchaInput
        onVerify={mockOnVerify}
        onError={mockOnError}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'WRONG');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('验证失败');
    });
  });

  it('应该显示错误信息', async () => {
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const verifyButton = screen.getByText('验证');
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText('请输入验证码')).toBeInTheDocument();
    });
  });

  it('应该处理刷新验证码', async () => {
    const user = userEvent.setup();
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const refreshButton = screen.getByTitle('刷新验证码');
    await user.click(refreshButton);

    // 刷新后应该生成新的验证码
    expect(screen.getByTitle('点击刷新验证码')).toBeInTheDocument();
  });

  it('应该处理音频验证码播放', async () => {
    const user = userEvent.setup();
    const mockSpeak = vi.fn();
    
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak: mockSpeak },
      configurable: true,
    });
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const audioButton = screen.getByTitle('音频验证码');
    await user.click(audioButton);

    expect(mockSpeak).toHaveBeenCalled();
  });

  it('应该正确转换输入为大写', async () => {
    const user = userEvent.setup();
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'abcd');

    expect(input).toHaveValue('ABCD');
  });

  it('应该在验证中状态下禁用按钮', async () => {
    const user = userEvent.setup();
    let resolveVerify: (value: boolean) => void;
    const pendingPromise = new Promise<boolean>((resolve) => {
      resolveVerify = resolve;
    });
    mockOnVerify.mockReturnValue(pendingPromise);
    
    render(<CaptchaInput onVerify={mockOnVerify} />);

    const input = screen.getByRole('textbox');
    const verifyButton = screen.getByText('验证');

    await user.type(input, 'TEST');
    await user.click(verifyButton);

    expect(screen.getByText('验证中...')).toBeInTheDocument();
    expect(verifyButton).toBeDisabled();

    resolveVerify!(true);
  });
});

describe('useCaptcha', () => {
  const mockOnVerify = vi.fn();
  let hookResult: any;

  function TestComponent() {
    hookResult = useCaptcha(mockOnVerify);
    return null;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnVerify.mockResolvedValue(true);
  });

  it('应该初始化验证码状态', () => {
    render(<TestComponent />);

    expect(hookResult.isVerified).toBe(false);
    expect(hookResult.error).toBe('');
  });

  it('应该处理验证成功', () => {
    render(<TestComponent />);

    hookResult.handleSuccess();

    expect(hookResult.isVerified).toBe(true);
    expect(hookResult.error).toBe('');
  });

  it('应该处理验证错误', () => {
    render(<TestComponent />);

    const errorMessage = '验证码错误';
    hookResult.handleError(errorMessage);

    expect(hookResult.isVerified).toBe(false);
    expect(hookResult.error).toBe(errorMessage);
  });

  it('应该重置验证状态', () => {
    render(<TestComponent />);

    // 先设置一些状态
    hookResult.handleSuccess();
    hookResult.handleError('错误');

    // 然后重置
    hookResult.reset();

    expect(hookResult.isVerified).toBe(false);
    expect(hookResult.error).toBe('');
  });

  it('应该提供正确的 captchaProps', () => {
    render(<TestComponent />);

    expect(hookResult.captchaProps).toEqual({
      onVerify: mockOnVerify,
      onSuccess: hookResult.handleSuccess,
      onError: hookResult.handleError,
    });
  });
});