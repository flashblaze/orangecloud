import Login from '~/components/modules/auth/Login';

export const meta = () => {
  return [
    { title: 'Login | OrangeCloud' },
    { name: 'description', content: 'Login to OrangeCloud' },
  ];
};

const LoginPage = () => {
  return <Login />;
};

export default LoginPage;
