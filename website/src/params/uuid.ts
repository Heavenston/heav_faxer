import type { ParamMatcher } from '@sveltejs/kit';
import { type } from "arktype";

const uuid = type("string.uuid");

export const match = ((param: string): param is string => {
	return uuid.allows(param);
}) satisfies ParamMatcher;
