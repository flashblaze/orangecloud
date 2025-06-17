import Signup from '~/components/modules/auth/Signup';

export const meta = () => {
  return [
    { title: 'Signup | OrangeCloud' },
    { name: 'description', content: 'Signup to OrangeCloud' },
  ];
};

const SignupPage = () => {
  return <Signup />;
};

export default SignupPage;
