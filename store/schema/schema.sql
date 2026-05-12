CREATE TABLE users (
	user_id       INT                PRIMARY KEY AUTO_INCREMENT,
	email         VARCHAR(320)       NOT NULL UNIQUE,
	username      VARCHAR(255)       NULL UNIQUE,
	created_at    DATETIME(6)        NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
	updated_at    DATETIME(6)        NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
	first_name    VARCHAR(255)       NOT NULL,
	last_name     VARCHAR(255)       NOT NULL,
	password_hash VARBINARY(255)     NOT NULL,
	profile_url   VARCHAR(255)       NULL,
	user_points   INT                NULL,
	description   TEXT

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;



  CREATE TABLE regions (
	region_id    INT                 PRIMARY KEY AUTO_INCREMENT,
	region_name  VARCHAR(50)         NOT NULL

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE locations (
    loc_id      INT                  PRIMARY KEY AUTO_INCREMENT,
    loc_name    VARCHAR(255)         NOT NULL,
	longitude   DECIMAL(10,6)        ,
	latitude    DECIMAL(10,6)        ,

	CONSTRAINT fk_loc_region
	FOREIGN KEY (region_id) REFERENCES regions(region_id)

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE quests (
	quest_id      INT                PRIMARY KEY AUTO_INCREMENT,
	quest_name    VARCHAR(255)       NOT NULL,
	is_complete   TINYINT(1)         DEFAULT 0,
	region_id     INT                NOT NULL,

	CONSTRAINT fk_quest_loc
	FOREIGN KEY (region_id) REFERENCES regions(region_id)

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE badges (
	badge_id     INT                 PRIMARY KEY AUTO_INCREMENT,
	badge_name   VARCHAR(255)        NOT NULL,
	badge_des    TEXT                
	
)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE relics (
	relic_id     INT                 PRIMARY KEY AUTO_INCREMENT,
	relic_name   VARCHAR(255)        NOT NULL,
	region_id    INT                 NOT NULL,

	CONSTRAINT fk_relic_region
	FOREIGN KEY (region_id) REFERENCES regions(region_id)
	
)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE quest_progress (
	quest_id        INT               NOT NULL,
	user_id         INT               NOT NULL,
	is_complete     TINYINT(1)        DEFAULT 0,

	CONSTRAINT pk_user_quest PRIMARY KEY(user_id, quest_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	FOREIGN KEY (quest_id) REFERENCES quests(quest_id)
	ON DELETE CASCADE

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE location_progress (
	loc_id          INT               NOT NULL,
	user_id         INT               NOT NULL,
	is_exp         TINYINT(1)         DEFAULT 0,

	CONSTRAINT pk_user_locs PRIMARY KEY(user_id, loc_id),
	FOREIGN KEY (user_id) REFERENCES users(user_id),
	FOREIGN KEY (loc_id) REFERENCES locations(loc_id)
	ON DELETE CASCADE

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE badge_progress (
	badge_id     INT                 NOT NULL,
	user_id      INT                 NOT NULL,
	
	CONSTRAINT pk_badge_user PRIMARY KEY(badge_id,user_id),
	FOREIGN KEY(badge_id) REFERENCES badges(badge_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
	ON DELETE CASCADE

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE user_inventory (
	relic_id       INT          NOT NULL,
	user_id        INT          NOT NULL,

	CONSTRAINT pk_relic_user PRIMARY KEY(relic_id,user_id),
	FOREIGN KEY(relic_id) REFERENCES relics(relic_id),
    FOREIGN KEY(user_id) REFERENCES users(user_id)
	ON DELETE CASCADE

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;



CREATE TABLE user_itineraries (
	itinerary_id    INT           NOT NULL,
	user_id         INT           NOT NULL,
	item            MEDIUMTEXT    NOT NULL,

	CONSTRAINT fk_user_itinerary
	FOREIGN KEY(user_id) REFERENCES users(user_id)
	ON DELETE CASCADE
	

)ENGINE = InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;




-- POSSIBLE SCHEMAS ---- END OF WORKING SITE --

-- Incase of upscale and better logging of sessions
-- CREATE TABLE session (
-- 	session_id    VARCHAR(255)  PRIMARY KEY,
-- 	user_id       INT           NOT NULL

-- 	CONSTRAINT fk_session_user
--     FOREIGN KEY(user_id) REFERENCES users(user_id)
-- 	ON DELETE CASCADE
-- )ENGINE = InnoDB
-- DEFAULT CHARSET=utf8mb4
-- COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE quiz_progress (
-- 	user_id     INT         NOT NULL,
-- 	quiz_id     INT         NOT NULL,
-- 	score       DOUBLE      NULL,
-- 	is_complete TINYINT(1)  DEFAULT 0,

-- 	CONSTRAINT pk_user_quiz PRIMARY KEY(user_id, quiz_id),
-- 	FOREIGN KEY (user_id) REFERENCES users(user_id),
-- 	FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id)
-- 	ON DELETE CASCADE

-- )ENGINE = InnoDB
-- DEFAULT CHARSET=utf8mb4
-- COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE quiz (
-- 	quiz_id       INT            PRIMARY KEY AUTO_INCREMENT,
-- 	creator_id    INT            NULL,
-- 	title         VARCHAR(255)   NOT NULL,
-- 	description   TEXT,
-- 	created_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
-- 	updated_at    DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
-- 	passing_score INT            NULL,
-- 	is_published  TINYINT(1)     NOT NULL DEFAULT 0,
-- 	is_public     TINYINT(1)     NOT NULL DEFAULT 1,

-- 	CONSTRAINT quiz_creator_id
-- 		FOREIGN KEY (creator_id)
-- 		REFERENCES users(user_id)
-- ) ENGINE=InnoDB
--   DEFAULT CHARSET=utf8mb4
--   COLLATE=utf8mb4_unicode_ci;


-- CREATE TABLE question (
-- 	question_id   INT            PRIMARY KEY AUTO_INCREMENT,
-- 	quiz_id       INT            NOT NULL,
-- 	question      TEXT           NOT NULL,

-- 	CONSTRAINT fk_question_quiz
-- 	FOREIGN KEY (quiz_id) REFERENCES quiz(quiz_id)
-- 	ON DELETE CASCADE,

-- 	INDEX idx_quiz_id (quiz_id)

-- ) ENGINE=InnoDB
--   DEFAULT CHARSET=utf8mb4
--   COLLATE=utf8mb4_unicode_ci;

--   CREATE TABLE answers (
-- 	answer_id     INT           PRIMARY KEY AUTO_INCREMENT,
-- 	question_id   INT           NOT NULL,
-- 	answer        TEXT          NOT NULL

-- ) ENGINE=InnoDB
--   DEFAULT CHARSET=utf8mb4
--   COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE words (
--     word_id          INT          PRIMARY KEY AUTO_INCREMENT,
--     word_answer      VARCHAR(30)  NOT NULL

-- )ENGINE = InnoDB
-- DEFAULT CHARSET=utf8mb4
-- COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE images (
--     image_id    INT          PRIMARY KEY AUTO_INCREMENT,
--     word_id     INT          NOT NULL,
--     picture_url VARCHAR(255) NOT NULL,
--     description TEXT         NOT NULL,
    
--     CONSTRAINT fk_images_word
--     FOREIGN KEY(word_id) REFERENCES words(word_id)

-- )ENGINE = InnoDB
-- DEFAULT CHARSET=utf8mb4
-- COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE exploration (
-- 	explore_id   INT         PRIMARY KEY,
-- 	user_id      INT         NOT NULL,
	
-- 	CONSTRAINT fk_explore_user
--     FOREIGN KEY(user_id) REFERENCES users(user_id)
-- 	ON DELETE CASCADE

-- )ENGINE = InnoDB
-- DEFAULT CHARSET=utf8mb4
-- COLLATE=utf8mb4_unicode_ci;