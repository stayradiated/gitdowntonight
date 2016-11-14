# Git Down Tonight

## Installation

```
git clone https://github.com/stayradiated/gitdowntonight
cd gitdowntonight
yarn
```

## Usage

**By default it will display the top 15 contributors**

```
GH_ACCESS_TOKEN=<access_token_here> node index.js
```

**Display all contributors**

```
node index.js --limit -1
```

**Poll every 30 seconds**

```
node index.js --poll 30
```

**Set owner without having to type it in every time**

```
node index.js --owner stayradiated
```
