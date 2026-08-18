USE yatra_enterprise;

CREATE TABLE IF NOT EXISTS location_pings (
    ping_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('Vehicle', 'Driver', 'Traveller') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    trip_id INT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    speed DECIMAL(5,2) NULL COMMENT 'Speed in km/h',
    heading DECIMAL(5,2) NULL COMMENT 'Heading in degrees',
    accuracy DECIMAL(8,2) NULL COMMENT 'Accuracy in meters',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id, timestamp),
    INDEX idx_trip (trip_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
