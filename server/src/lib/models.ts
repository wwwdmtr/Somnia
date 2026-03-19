import { type User } from '@prisma/client';
import _ from 'lodash';

export const toClientMe = (user: User | null) => {
  return (
    user &&
    _.pick(user, [
      'id',
      'nickname',
      'name',
      'bio',
      'email',
      'permissions',
      'avatar',
    ])
  );
};

export type ClientMe = ReturnType<typeof toClientMe>;
