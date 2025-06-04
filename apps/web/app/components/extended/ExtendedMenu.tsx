import { Menu } from '@mantine/core';

const ExtendedMenu = Menu.extend({
  classNames: {
    dropdown: 'rounded-lg shadow-lg',
  },
});

export default ExtendedMenu;
