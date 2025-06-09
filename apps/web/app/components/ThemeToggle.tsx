import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import IconLaptop from '~icons/solar/laptop-bold-duotone';
import IconMoon from '~icons/solar/moon-bold-duotone';
import IconSun from '~icons/solar/sun-2-bold-duotone';

const ThemeToggle = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const getIcon = () => {
    switch (colorScheme) {
      case 'dark':
        return <IconMoon width={18} height={18} className="text-primary-500" />;
      case 'light':
        return <IconSun width={18} height={18} className="text-primary-500" />;
      default:
        return <IconLaptop width={18} height={18} className="text-primary-500" />;
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
          leftSection={<IconLaptop width={16} height={16} />}
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
