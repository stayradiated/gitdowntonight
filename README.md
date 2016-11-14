# Git Down Tonight

## Installation

```
git clone https://github.com/stayradiated/gitdowntonight
cd gitdowntonight
yarn
npm link
```

## Usage

**By default it will display the top 15 contributors**

```
export GH_ACCESS_TOKEN=<access_token_here>
gitdowntonight
```

**Display all contributors**

```
gitdowntonight --limit -1
```

**Poll every 30 seconds**

```
gitdowntonight --poll 30
```

**Set owner without having to type it in every time**

```
gitdowntonight --owner stayradiated
```

**Save changes to a text file**

```
gitdowntonight --out ranking.txt
```
