#TODO: DOCKERFILE BUILD FUNCTIONS
############################################################################################################
build:
	echo "dev_build çalıştı."
	{ \
		echo "TAG=$(TAG)"; \
	} > ./.env.prod
	docker-compose stop nestjs
	docker system prune -a -f --all
	docker system prune -a -f --volumes
	docker login -u '$(DEV_DEPLOY_USERNAME)' -p '$(DEV_DEPLOY_PASSWORD)' 'registry.gitlab.com'
	docker-compose --env-file ./.env.prod up -d --build nestjs


#TODO: FIRST BUILD FUNCTIONS
############################################################################################################
build_first:
	echo "dev_build_first çalıştı."
	make build
	sleep 10
	make after_build

after_build:
	echo "dev_after_build çalıştı."


#TODO: REBUILD BUILD FUNCTIONS
############################################################################################################
rebuild:
	echo "dev_rebuild çalıştı."
	make build
	sleep 10
	make after_rebuild

after_rebuild:
	echo "dev_after_rebuild çalıştı."


#TODO: REMOVE FUNCTIONS
############################################################################################################
remove_container:
	echo "dev_remove_container çalıştı."
	docker-compose down --rmi all -v
	docker system prune -a -f --all
	docker system prune -a -f --volumes