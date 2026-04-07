CREATE TABLE users (
	id            INT            NOT NULL AUTO_INCREMENT,
	email         VARCHAR(320)   NOT NULL,
	created_at    DATETIME(6)    NOT NULL,
	updated_at    DATETIME(6)    NOT NULL,
	first_name    VARCHAR(255)   NOT NULL,
	last_name     VARCHAR(255)   NOT NULL,
	password_hash VARBINARY(255) NOT NULL,
	deleted_at    DATETIME(6),
	middle_name   VARCHAR(255),
	description   TEXT,
	longitude     DOUBLE,
	latitude      DOUBLE,

	CONSTRAINT PRIMARY KEY (id),
	CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
