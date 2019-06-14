import pathToRegexp from 'path-to-regexp';

import { toQuerystring } from './utils';

export default class Route {
  constructor({ name, pattern, page = name }) {
    if (!name && !page) {
      throw new Error(`Missing page to render for route "${pattern}"`);
    }

    this.name = name;
    this.pattern = pattern || `/${name}`;
    this.page = page.replace(/(^|\/)index$/, '').replace(/^\/?/, '/');
    this.regex = pathToRegexp(this.pattern, (this.keys = []));
    this.keyNames = this.keys.map(key => key.name);
    this.toPath = pathToRegexp.compile(this.pattern);
  }

  match(path) {
    const values = this.regex.exec(path);
    if (values) {
      return this.valuesToParams(values.slice(1));
    }
  }

  valuesToParams(values) {
    return values.reduce((params, val, i) => {
      if (val === undefined) {
        return params;
      }

      params[this.keys[i].name] = decodeURIComponent(val);

      return params;
    }, {});
  }

  getHref(params = {}) {
    return `${this.page}?${toQuerystring(params)}`;
  }

  getAs(params = {}) {
    const as = this.toPath(params) || '/';
    const queryKeys = Object.keys(params).filter(
      key => !this.keyNames.includes(key)
    );

    if (!queryKeys.length) {
      return as;
    }

    const query = {};

    queryKeys.forEach(key => {
      query[key] = params[key];
    });

    return `${as}?${toQuerystring(query)}`;
  }

  getUrls(params) {
    const as = this.getAs(params);
    const href = this.getHref(params);
    return { as, href };
  }
}
