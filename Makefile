start:
	rm -rf node_modules
	docker-compose up -d --build --force-recreate nestjs
	docker cp valdoricrmapi:/app/node_modules .
	docker cp valdoricrmapi:/app/package.json .
	docker cp valdoricrmapi:/app/package-lock.json .

stop:
	docker-compose down --rmi all -v
	rm -rf node_modules

copy:
	rm -rf node_modules
	docker cp valdoricrmapi:/app/node_modules .
	docker cp valdoricrmapi:/app/package.json .
	docker cp valdoricrmapi:/app/package-lock.json .

restart:
	docker-compose restart nestjs

logs:
	docker logs -f --tail 200 valdoricrmapi

exec:
	docker exec -it valdoricrmapi sh


	

