#### Set Mapping

Set mapping obtained from [pkmncards.com](https://pkmncards.com/sets/) by running the script below in the console.

```js
$x("//div[contains(@class, 'entry-content')]//li/a/text()")
  .map((el) => el.textContent)
  .filter((text) => new RegExp(/^.*\(.*\)$/).test(text))
  .map((text) => {
    const regexMatch = new RegExp(/^(.*) \((.*)\)$/).exec(text);

    return {
      name: regexMatch[1],
      abbr: regexMatch[2],
    };
  });
```
