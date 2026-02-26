import type { LayoutLoad } from './$types';
import type { ListTabsResponse } from './api/list-tabs/+server';

export const load: LayoutLoad = async ({ data, fetch }) => {
  const { tabs }: ListTabsResponse = await (await fetch("/api/list-tabs")).json();
  return {
    ...data,
    tabs,
  };
};

