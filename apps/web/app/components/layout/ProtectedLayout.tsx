import { AppShell, Button } from '@mantine/core';
// import { motion } from 'framer-motion';
// import { Link } from 'react-router';
import IconPlus from '~icons/solar/add-circle-bold-duotone';
// import IconSolarBoltBold from '~icons/solar/bolt-bold-duotone';
// import IconSolarBolt from '~icons/solar/bolt-broken';
// import IconSolarHomeBold from '~icons/solar/home-smile-angle-bold-duotone';
// import IconSolarHome from '~icons/solar/home-smile-angle-broken';
// import IconSolarPieChartBold from '~icons/solar/pie-chart-2-bold-duotone';
// import IconSolarPieChart from '~icons/solar/pie-chart-2-broken';

import { useState } from 'react';
import ThemeToggle from '../ThemeToggle';
// import { cn } from '~/utils';
import CreateBucketModal from '../modules/bucket/CreateBucketModal';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

// const navLinks = [
//   {
//     link: '/dashboard',
//     label: 'Dashboard',
//     icon: <IconSolarHome className="text-base" />,
//     iconActive: <IconSolarHomeBold className="text-base" />,
//   },
//   {
//     link: '/activities',
//     label: 'Activities',
//     icon: <IconSolarBolt className="text-base" />,
//     iconActive: <IconSolarBoltBold className="text-base" />,
//   },
//   {
//     link: '/reports',
//     label: 'Reports',
//     icon: <IconSolarPieChart className="text-base" />,
//     iconActive: <IconSolarPieChartBold className="text-base" />,
//   },
// ];

// type NavLinkProps = {
//   item: {
//     link: string;
//     label: string;
//     icon: React.ReactNode;
//     iconActive: React.ReactNode;
//   };
//   onNavigate?: () => void;
// };

// const NavLink = ({ item, onNavigate }: NavLinkProps) => {
//   const location = useLocation();
//   const isActive = location.pathname.includes(item.link);

//   const handleClick = () => {
//     if (onNavigate) {
//       onNavigate();
//     }
//   };

//   return (
//     <Link
//       className={cn(
//         'relative mb-2 flex items-center gap-2 rounded-lg p-2 text-gray-600 text-sm no-underline dark:text-gray-200',
//         !isActive && 'hover:bg-primary-100 focus:bg-primary-100 dark:hover:bg-primary-500',
//         isActive && 'text-primary-600 dark:text-white'
//       )}
//       key={item.label}
//       to={item.link}
//       onClick={handleClick}
//     >
//       {isActive ? item.iconActive : item.icon}
//       <span>{item.label}</span>
//       <motion.div
//         className="absolute inset-0 rounded-lg bg-primary-200 dark:bg-primary-600"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: isActive ? 1 : 0 }}
//         transition={{
//           type: 'spring',
//           stiffness: 200,
//           damping: 35,
//         }}
//         style={{ zIndex: -1 }}
//       />
//     </Link>
//   );
// };

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const [createBucketModalOpened, setCreateBucketModalOpened] = useState(false);

  //   const links = navLinks.map((item) => <NavLink key={item.label} item={item} onNavigate={close} />);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 200, breakpoint: 'md', collapsed: { mobile: false } }}
      padding="md"
      classNames={{
        main: 'bg-white min-h-screen dark:bg-zinc-800 border rounded-md',
        navbar: 'bg-gray-50 dark:bg-zinc-900 border-r-0',
        header: 'bg-gray-50 dark:bg-zinc-900 border-b-0',
      }}
    >
      <AppShell.Header p="md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="OrangeCloud logo" className="h-10 w-10" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-gray-700 text-lg dark:text-white">OrangeCloud</span>
            </div>
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Button
            onClick={() => setCreateBucketModalOpened(true)}
            leftSection={<IconPlus className="h-5 w-5" />}
          >
            New
          </Button>
          <CreateBucketModal
            opened={createBucketModalOpened}
            onClose={() => setCreateBucketModalOpened(false)}
          />
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <div className="container mx-auto 3xl:p-4 p-0">{children}</div>
      </AppShell.Main>
    </AppShell>
  );
};

export default ProtectedLayout;
