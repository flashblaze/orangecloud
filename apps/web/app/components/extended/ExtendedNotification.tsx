import { Notification } from '@mantine/core';

const ExtendedNotification = Notification.extend({
  defaultProps: {
    classNames: {
      root: 'rounded-lg',
    },
    withBorder: true,
  },
});

export default ExtendedNotification;
