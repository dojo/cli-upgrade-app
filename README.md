# @dojo/cli-upgrade
The official CLI command for upgrading Dojo applications.

## Usage
### Prerequisites
This command requires the [`@dojo/cli`](https://github.com/dojo/cli) package to be installed globally.

```bash
npm install --global @dojo/cli
```

### Installation
To use the `@dojo/cli-upgrade-app` in a single project, install the package using npm.

```bash
npm install @dojo/cli-upgrade-app
```

### Basic Usage
Within the root of a Dojo application the command can be used with the `upgrade` command.

```bash
dojo upgrade
```

## Contributing

We appreciate your interest!  Please see the [Dojo Contributing Guidelines](https://github.com/dojo/framework/blob/master/CONTRIBUTING.md).

Version upgrades are defined in directories starting with "v" and the major version number, (e.g. `v3`). Each version's configuration should be exported as `config` from a `main.ts` file in the directory.

### Installation
After running `npm install`, run the npm build script
```bash
npm run build
```

### Testing
Test cases should be written using [Intern](https://theintern.io/)
To test, run the npm test command.
```bash
npm test
```

### Building a local package

Sometimes it is useful to build a local package for testing. `@dojo/cli-upgrade-app` can be built into a local tarball and installed.

* `npm run build`
* `cd dist/release`
* `npm pack`
* update `package.json` with the dependency `{ "@dojo/cli-upgrade-app": "file:[path to tarball]" }`

## Licensing Information

© 2019 [OpenJS Foundation](https://openjsf.org). [New BSD](http://opensource.org/licenses/BSD-3-Clause) license.
