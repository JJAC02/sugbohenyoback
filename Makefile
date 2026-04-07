migrate:
	atlas schema apply --env prod

database:
	mariadb -u $(DB_USERNAME) -p$(DB_PASSWORD) -h $(DB_HOST) \
		-P $(DB_PORT) --skip-ssl $(DB_NAME)

database_dev:
	mariadb -u $(DB_DEV_USERNAME) -p$(DB_DEV_PASSWORD) \
		-h $(DB_DEV_HOST) -P $(DB_DEV_PORT) --skip-ssl \
		$(DB_DEV_NAME)

.PHONY: migrate database database_dev
