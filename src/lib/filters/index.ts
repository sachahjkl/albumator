export type FilteredItem<T> =
	| {
			item: T;
			rejected: false;
	  }
	| {
			item: T;
			rejected: true;
			reason: string;
	  };

export type FilterResult = { rejected: true; reason: string } | { rejected: false };
export type SyncFilter<T> = (item: T) => FilterResult;
export type AsyncFilter<T> = (item: T) => Promise<FilterResult>;
