migrate:
	atlas schema apply --env prod

database:
	@echo "mariadb $(DB_NAME)"
	@mariadb -u $(DB_USERNAME) -p$(DB_PASSWORD) -h $(DB_HOST) \
		-P $(DB_PORT) --skip-ssl $(DB_NAME)

database_dev:
	@echo "mariadb $(DB_DEV_NAME)"
	@mariadb -u $(DB_DEV_USERNAME) -p$(DB_DEV_PASSWORD) \
		-h $(DB_DEV_HOST) -P $(DB_DEV_PORT) --skip-ssl \
		$(DB_DEV_NAME)

clean:
	@echo "mariadb $(DB_DEV_NAME) -e \"DROP DATABASE $(DB_DEV_NAME); CREATE DATABASE $(DB_DEV_NAME);\""
	@mariadb -u $(DB_DEV_USERNAME) -p$(DB_DEV_PASSWORD) \
                -h $(DB_DEV_HOST) -P $(DB_DEV_PORT) --skip-ssl \
                $(DB_DEV_NAME) -e "DROP DATABASE $(DB_DEV_NAME); CREATE DATABASE $(DB_DEV_NAME);"

.PHONY: migrate database database_dev clean
