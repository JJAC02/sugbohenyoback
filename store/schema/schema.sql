CREATE TABLE users (
	user_id       INT            PRIMARY KEY AUTO_INCREMENT,
	email         VARCHAR(320)   NOT NULL UNIQUE,
	created_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	updated_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
	first_name    VARCHAR(255)   NOT NULL,
	last_name     VARCHAR(255)   NOT NULL,
	password_hash VARBINARY(255) NOT NULL,
	deleted_at    DATETIME(6)    ,
	description   TEXT

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE quiz (
	quiz_id       INT            PRIMARY KEY AUTO_INCREMENT,
	creator_id    INT            NULL,
	title         VARCHAR(255)   NOT NULL,
	description   TEXT,
	created_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	updated_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
	passing_score INT            NULL,
	is_published  TINYINT(1)     NOT NULL DEFAULT 0,
	is_public     TINYINT(1)     NOT NULL DEFAULT 1,

	CONSTRAINT quiz_creator_id
		FOREIGN KEY (creator_id)
		REFERENCES users(user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE question (
	question_id   INT            PRIMARY KEY AUTO_INCREMENT,
	quiz_id       INT            NOT NULL,
	question      TEXT           NOT NULL,

	CONSTRAINT fk_question_quiz
	FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id)
	ON DELETE CASCADE,

	INDEX idx_quiz_id (quiz_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

  CREATE TABLE answers (
	answer_id     INT           PRIMARY KEY AUTO_INCREMENT,
	question_id   INT           NOT NULL,
	answer        TEXT          NOT NULL

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


  CREATE TABLE session (
	session_id     INT           PRIMARY KEY AUTO_INCREMENT,
	user_id        INT           NOT NULL,
	session_token  VARCHAR(255)  NOT NULL,
	created_at     DATETIME(6)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
	expires_at     DATETIME(6)   ,
	is_active      BOOLEAN       DEFAULT TRUE,
	
	CONSTRAINT fk_session_user
	FOREIGN KEY(user_id) REFERENCES users(user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE words (
    word_id          INT          PRIMARY KEY AUTO_INCREMENT,
    word_answer      VARCHAR(30)  NOT NULL

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


CREATE TABLE images (
    image_id    INT          PRIMARY KEY AUTO_INCREMENT,
    word_id     INT          NOT NULL,
    picture_url VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    
    CONSTRAINT fk_images_word
    FOREIGN KEY(word_id) REFERENCES words(word_id)

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;