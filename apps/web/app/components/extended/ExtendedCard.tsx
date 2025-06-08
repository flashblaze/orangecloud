import { Card } from '@mantine/core';

const ExtendedCard = Card.extend({
  classNames: {
    root: 'rounded-xl bg-card-background border border-card-border hover:bg-card-background-hover',
  },
});

export default ExtendedCard;
