import { Button } from '@mantine/core';

const ExtendedButton = Button.extend({
  defaultProps: {
    classNames: {
      root: 'rounded-lg shadow-sm',
    },
  },
});

export default ExtendedButton;
