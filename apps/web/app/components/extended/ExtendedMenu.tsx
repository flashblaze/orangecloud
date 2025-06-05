import { type MantineThemeComponent, Menu } from '@mantine/core';

const ExtendedMenu: MantineThemeComponent = Menu.extend({
  classNames: {
    dropdown: 'rounded-lg shadow-lg',
  },
});

export default ExtendedMenu;
