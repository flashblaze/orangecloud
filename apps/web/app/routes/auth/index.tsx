import { redirect } from 'react-router';

export function loader() {
  return redirect('/auth/login');
}

const AuthIndex = () => {
  return null;
};

export default AuthIndex;
