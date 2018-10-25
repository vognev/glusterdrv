APP_NAME=glusterdrv
APP_VERSION=$(shell git describe --tags --abbrev=0)

PLUGIN_USER ?= vognev
PLUGIN_NAME ?= glusterdrv
PLUGIN_TAG ?= latest
PLUGIN_IMAGE ?= $(PLUGIN_USER)/$(PLUGIN_NAME):$(PLUGIN_TAG)

ERROR_COLOR=\033[31;01m
NO_COLOR=\033[0m
OK_COLOR=\033[32;01m
WARN_COLOR=\033[33;01m

docker-image:
	@echo -e "$(OK_COLOR)==> Docker build image : ${PLUGIN_IMAGE} $(NO_COLOR)"
	docker build -t ${PLUGIN_IMAGE} .

docker-plugin: docker-rootfs docker-plugin-create

docker-rootfs: docker-image
	@echo -e "$(OK_COLOR)==> create rootfs directory in ./plugin/rootfs$(NO_COLOR)"
	@mkdir -p ./plugin/rootfs
	@cntr=${PLUGIN_USER}-${PLUGIN_NAME}-${PLUGIN_TAG}-$$(date +'%Y%m%d-%H%M%S'); \
	docker create --name $$cntr ${PLUGIN_IMAGE}; \
	docker export $$cntr | tar -x -C ./plugin/rootfs; \
	docker rm -vf $$cntr
	@echo -e "### copy config.json to ./plugin/$(NO_COLOR)"
	@cp config.json ./plugin/

docker-plugin-create:
	@echo -e "$(OK_COLOR)==> Remove existing plugin : ${PLUGIN_IMAGE} if exists$(NO_COLOR)"
	@docker plugin rm -f ${PLUGIN_IMAGE} || true
	@echo -e "$(OK_COLOR)==> Create new plugin : ${PLUGIN_IMAGE} from ./plugin$(NO_COLOR)"
	docker plugin create ${PLUGIN_IMAGE} ./plugin

docker-plugin-push:
	@echo -e "$(OK_COLOR)==> push plugin : ${PLUGIN_IMAGE}$(NO_COLOR)"
	docker plugin push ${PLUGIN_IMAGE}

docker-plugin-upgrade:
    docker plugin upgrade ${PLUGIN_IMAGE}

clean:
	@rm -rf ./plugin