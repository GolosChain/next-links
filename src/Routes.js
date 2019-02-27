import React from 'react';
import { parse } from 'url';
import NextLink from 'next/link';
import NextRouter from 'next/router';

import Route from './Route';

export default class Routes {
  constructor({ Link = NextLink, Router = NextRouter } = {}) {
    this.routes = [];
    this.Link = this.getLink(Link);
    this.Router = this.getRouter(Router);
  }

  add(name, pattern, page) {
    let options;
    if (name instanceof Object) {
      options = name;
      name = options.name;
    } else {
      if (name.startsWith('/')) {
        page = pattern;
        pattern = name;
        name = null;
      }
      options = { name, pattern, page };
    }

    if (this.findByName(name)) {
      throw new Error(`Route "${name}" already exists`);
    }

    this.routes.push(new Route(options));
    return this;
  }

  findByName(name) {
    if (name) {
      return this.routes.filter(route => route.name === name)[0];
    }
  }

  match(url) {
    const parsedUrl = parse(url, true);
    const { pathname, query } = parsedUrl;

    const base = { parsedUrl, query };

    for (let i = 0; i < this.routes.length; i++) {
      const route = this.routes[i];

      const params = route.match(pathname);

      if (params) {
        return {
          ...base,
          route,
          params,
          query: { ...query, ...params },
        };
      }
    }

    return base;
  }

  findAndGetUrls(nameOrUrl, params) {
    const route = this.findByName(nameOrUrl);

    if (route) {
      return { route, urls: route.getUrls(params), byName: true };
    } else {
      const { route, query } = this.match(nameOrUrl);
      const href = route ? route.getHref(query) : nameOrUrl;
      const urls = { href, as: nameOrUrl };
      return { route, urls };
    }
  }

  getRequestHandler(app, customHandler) {
    const nextHandler = app.getRequestHandler();

    return (req, res) => {
      const { route, query, parsedUrl } = this.match(req.url);

      if (route) {
        if (customHandler) {
          customHandler({ req, res, route, query });
        } else {
          app.render(req, res, route.page, query);
        }
      } else {
        nextHandler(req, res, parsedUrl);
      }
    };
  }

  getLink(Link) {
    return props => {
      const { route, params, to, hash, ...newProps } = props;

      const { href, as } = this.findAndGetUrls(route || to, params).urls;

      return (
        <Link {...newProps} href={href} as={as + (hash ? `#${hash}` : '')} />
      );
    };
  }

  getRouter(Router) {
    const wrap = method => (route, params, options) => {
      const { byName, urls } = this.findAndGetUrls(route, params);
      return Router[method](urls.href, urls.as, byName ? options : params);
    };

    Router.pushRoute = wrap('push');
    Router.replaceRoute = wrap('replace');
    Router.prefetchRoute = wrap('prefetch');
    return Router;
  }
}
