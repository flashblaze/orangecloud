import { ActionIcon } from '@mantine/core';

const ExtendedActionIcon = ActionIcon.extend({
  defaultProps: {
    classNames: {
      root: 'rounded-lg shadow-sm',
    },
  },
});

export default ExtendedActionIcon;
