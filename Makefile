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

deploy:
	@echo "rsync -avz db.js server.js $(DEPLOY_SERVER_PATH)"
	@sshpass -p "$(SSH_PASSWORD)" \
		rsync -avz -e "ssh -p $(SSH_PORT)" --chmod=u+w  \
		--checksum db.js server.js \
		"$(SSH_USER)@$(SSH_HOST):$(DEPLOY_SERVER_PATH)"
	@echo "rsync -avz ./public/ $(DEPLOY_PUBLIC_PATH)"
	@sshpass -p "$(SSH_PASSWORD)" \
		rsync -avz -e "ssh -p $(SSH_PORT)" --chmod=u+w  \
		--checksum ./public/ \
		"$(SSH_USER)@$(SSH_HOST):$(DEPLOY_PUBLIC_PATH)"
	@echo 'ssh "pm2 restart all && pm2 save"'
	@sshpass -p "$(SSH_PASSWORD)" ssh -p $(SSH_PORT) \
		"$(SSH_USER)@$(SSH_HOST)" \
		"pm2 restart all && pm2 save"

.PHONY: migrate database database_dev clean deploy
