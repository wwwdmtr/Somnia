# 🌙 Somnia

**Somnia** — is a mobile app built with **React Native (Expo)** and **tRPC**, created for people who want to share their dreams and thoughts.

The project is built in a monorepository and is divided into:

- `webapp` — client app (React Native + Expo)
- `server` — backend (tRPC + Express)

---

## 🚀 Quick start

### 1. Clone repo

```bash
git clone https://github.com/wwwdmtr/somnia.git
cd somnia
```

### 2. Install dependencies

```bash
pnpm install

#In case if pnpm is not installed

npm install -g pnpm
```

### 3. To launch project

```bash
#from server folder run

pnpm dev

#from webapp folder run

pnpm expo start
```

### 4. Usefull scripts

```bash

pnpm types          #run types check

pnpm lint           #run Eslint rules check. Add flag '--fix' to fix if it's fixable

#I also recommend using the f and b filter flags to execute the script in a specific folder. This way you can avoid a bunch of open terminals.

#for Example

pnpm f lint --fix

```
