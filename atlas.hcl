env "prod" {
  url = "mysql://${getenv("DB_USERNAME")}:${getenv("DB_PASSWORD")}@${getenv("DB_HOST")}:${getenv("DB_PORT")}/${getenv("DB_NAME")}"
  src = "file://store/schema/schema.sql"
  dev = "mysql://${getenv("DB_DEV_USERNAME")}:${getenv("DB_DEV_PASSWORD")}@${getenv("DB_DEV_HOST")}:${getenv("DB_DEV_PORT")}/${getenv("DB_DEV_NAME")}"
}
