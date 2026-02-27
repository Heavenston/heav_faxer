import type { LayoutLoad } from './$types';
import type { ListTabsResponse } from './api/list-tabs/+server';

export const load: LayoutLoad = async ({ data, fetch }) => {
  let tabs: ListTabsResponse["tabs"] = [];
  if (data.user) {
    const resp: ListTabsResponse = await (await fetch("/api/list-tabs")).json();
    tabs = resp.tabs;
  }
  return {
    ...data,
    tabs,
  };
};

