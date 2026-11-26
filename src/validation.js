export const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };

export function validateRegistration(values) {
  const errors = {};
  const name = typeof values.name === 'string' ? values.name.trim() : '';
  const email = typeof values.email === 'string' ? values.email.trim() : '';
  const password = typeof values.password === 'string' ? values.password : '';
  if (!name) errors.name = 'Введите имя.';
  else if (name.length < 2 || name.length > 80) errors.name = 'Имя должно содержать от 2 до 80 символов.';
  if (!email) errors.email = 'Введите email.';
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Введите корректный email, например name@example.com.';
  if (!password) errors.password = 'Придумайте пароль.';
  else if (password.length < 8 || password.length > 128) errors.password = 'Используйте от 8 до 128 символов.';
  if (!values.confirmPassword) errors.confirmPassword = 'Повторите пароль.';
  else if (password !== values.confirmPassword) errors.confirmPassword = 'Пароли не совпадают.';
  return errors;
}
