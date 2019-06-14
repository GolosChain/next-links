export function toQuerystring(obj) {
  return Object.keys(obj)
    .filter(key => obj[key] !== null && obj[key] !== undefined)
    .map(key => {
      let value = obj[key];

      if (Array.isArray(value)) {
        value = value.join('/');
      }
      return [encodeURIComponent(key), encodeURIComponent(value)].join('=');
    })
    .join('&');
}
