import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import IconDeviceDesktop from '~icons/tabler/device-desktop';
import IconMoon from '~icons/tabler/moon';
import IconSun from '~icons/tabler/sun';

const ThemeToggle = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const getIcon = () => {
    switch (colorScheme) {
      case 'dark':
        return <IconMoon width={18} height={18} className="text-primary-500" />;
      case 'light':
        return <IconSun width={18} height={18} className="text-primary-500" />;
      default:
        return <IconDeviceDesktop width={18} height={18} className="text-primary-500" />;
    }
  };

  return (
    <Menu shadow="md" width={120}>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Toggle theme">
          {getIcon()}
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
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
          leftSection={<IconDeviceDesktop width={16} height={16} />}
          onClick={() => setColorScheme('auto')}
          data-active={colorScheme === 'auto' || undefined}
        >
          System
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};

export default ThemeToggle;
