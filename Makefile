.PHONY: log clean install build test start reset all

# Simple logger function
define log
	@echo "$(shell date '+%Y-%m-%d %H:%M:%S') $(1)"
endef

# 🧹 Clean lock + node_modules
clean:
	$(call log,🧹 Emptying yarn.lock...)
	@truncate -s 0 yarn.lock || true
	$(call log,🗑️ Deleting all node_modules...)
	@find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	$(call log,✅ Clean completed)

# 📦 Install dependencies
install:
	$(call log,📦 Running yarn install...)
	@yarn install
	$(call log,✅ Install completed)

# 🔧 TypeScript compile
build-ts:
	$(call log,📦 Running yarn tsc...)
	@yarn tsc
	$(call log,✅ TypeScript build completed)

# 🏗️ Full build
build:
	$(call log,🏗️ Running yarn build:all...)
	@yarn build:all
	$(call log,✅ Build completed)

# 🧪 Run tests
test:
	$(call log,🧪 Running yarn test:all...)
	@yarn test:all
	$(call log,✅ Tests completed)

# 🚀 Start Backstage (kills ports first)
start:
	$(call log,🚀 Killing ports 7007 & 3000...)
	@lsof -ti:7007 | xargs -r kill -9 || true
	@lsof -ti:3000 | xargs -r kill -9 || true
	$(call log,🚀 Starting Backstage...)
	@yarn start

# 🔄 Full reset (clean + install + start)
reset: clean install start

# 🧱 Full pipeline (what CI/CD would run)
all: install build-ts build test


#1 🔹 Start app
	# make start

#2 🔹 Clean everything
	# make clean

#3 🔹 Full rebuild
	# make reset

#4 🔹 CI-style pipeline
	# make all

#5 🔹 Run test
	# make test
