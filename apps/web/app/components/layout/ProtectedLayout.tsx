import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  Menu,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { useEnv } from '~/context/env-context';
import { useProtected } from '~/context/protected-context';
import useLogout from '~/queries/auth/useLogout';
import { cn } from '~/utils';
import IconPlus from '~icons/solar/add-circle-bold-duotone';
import IconSolarHomeBold from '~icons/solar/home-smile-angle-bold-duotone';
import IconSolarHome from '~icons/solar/home-smile-angle-broken';
import IconLaptop from '~icons/solar/laptop-bold-duotone';
import IconLogout from '~icons/solar/logout-3-bold-duotone';
import IconMoon from '~icons/solar/moon-bold-duotone';
import IconSettings from '~icons/solar/settings-bold-duotone';
import IconSun from '~icons/solar/sun-2-bold-duotone';
import CreateBucketModal from '../modules/bucket/CreateBucketModal';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

type NavLinkProps = {
  item: {
    link: string;
    label: string;
    icon: React.ReactNode;
    iconActive: React.ReactNode;
  };
  onNavigate?: () => void;
  className?: string;
};

const NavLink = ({ item, onNavigate, className }: NavLinkProps) => {
  const location = useLocation();
  const isActive =
    item.link === '/' ? location.pathname === '/' : location.pathname.includes(item.link);

  const handleClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <Link
      className={cn(
        'relative mb-2 flex items-center gap-2 rounded-lg p-2 text-gray-600 text-sm no-underline dark:text-gray-200',
        !isActive && 'hover:bg-primary-100 focus:bg-primary-100 dark:hover:bg-primary-500',
        isActive && 'text-primary-600 dark:text-white',
        className
      )}
      key={item.label}
      to={item.link}
      onClick={handleClick}
    >
      {isActive ? item.iconActive : item.icon}
      <span>{item.label}</span>
      <motion.div
        className="absolute inset-0 rounded-lg bg-primary-200 dark:bg-primary-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 35,
        }}
        style={{ zIndex: -1 }}
      />
    </Link>
  );
};

const UserMenu = () => {
  const session = useProtected();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { apiUrl } = useEnv();
  const logout = useLogout({ apiUrl });
  const navigate = useNavigate();

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'dark':
        return <IconMoon width={16} height={16} />;
      case 'light':
        return <IconSun width={16} height={16} />;
      default:
        return <IconLaptop width={16} height={16} />;
    }
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/auth/login', { replace: true });
  };

  return (
    <Menu width={200} position="bottom-end" offset={5}>
      <Menu.Target>
        <Avatar
          src={session.user.image}
          alt={session.user.name}
          size="md"
          className="cursor-pointer"
          color="primary"
        >
          {session.user.name.charAt(0).toUpperCase() || session.user.email.charAt(0).toUpperCase()}
        </Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Sub>
          <Menu.Sub.Target>
            <Menu.Sub.Item leftSection={getThemeIcon(colorScheme)}>Theme</Menu.Sub.Item>
          </Menu.Sub.Target>

          <Menu.Sub.Dropdown>
            <Menu.Item
              leftSection={<IconSun width={16} height={16} />}
              onClick={() => setColorScheme('light')}
              data-active={colorScheme === 'light' || undefined}
            >
              Light
            </Menu.Item>
            <Menu.Item
              leftSection={<IconMoon width={16} height={16} />}
              onClick={() => setColorScheme('dark')}
              data-active={colorScheme === 'dark' || undefined}
            >
              Dark
            </Menu.Item>
            <Menu.Item
              leftSection={<IconLaptop width={16} height={16} />}
              onClick={() => setColorScheme('auto')}
              data-active={colorScheme === 'auto' || undefined}
            >
              System
            </Menu.Item>
          </Menu.Sub.Dropdown>
        </Menu.Sub>
        <Menu.Item
          leftSection={<IconLogout width={16} height={16} />}
          color="red"
          onClick={handleLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const [createBucketModalOpened, setCreateBucketModalOpened] = useState(false);
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 200,
        breakpoint: 'md',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      classNames={{
        main: 'bg-white min-h-screen dark:bg-zinc-800',
        navbar: 'bg-gray-50 dark:bg-zinc-900 border-r-0',
        header: 'bg-gray-50 dark:bg-zinc-900 border-b-0',
      }}
    >
      <AppShell.Header p="md" className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="sm" />
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="OrangeCloud logo" className="h-10 w-10" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-medium text-gray-700 text-lg dark:text-white">OrangeCloud</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/settings">
            <ActionIcon variant="subtle" size="lg">
              <IconSettings className="h-5 w-5" />
            </ActionIcon>
          </Link>
          <UserMenu />
        </div>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          <Button
            variant="default"
            onClick={() => setCreateBucketModalOpened(true)}
            leftSection={<IconPlus className="h-5 w-5" />}
          >
            New
          </Button>
          <CreateBucketModal
            opened={createBucketModalOpened}
            onClose={() => setCreateBucketModalOpened(false)}
          />
          <NavLink
            item={{
              link: '/',
              label: 'Home',
              icon: <IconSolarHome className="text-base" />,
              iconActive: <IconSolarHomeBold className="text-base" />,
            }}
            onNavigate={toggleMobile}
            className="mt-4"
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
