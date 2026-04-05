-- Create database
CREATE DATABASE compiler_db;

-- Connect to database
\c compiler_db;

-- Create users table (ACID compliant, relational)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'free',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_expires TIMESTAMP,
    
    -- Usage tracking
    compilations_today INTEGER DEFAULT 0,
    total_compilations INTEGER DEFAULT 0,
    last_compilation TIMESTAMP,
    last_compilation_reset TIMESTAMP DEFAULT NOW(),
    
    -- Preferences (JSON for flexibility)
    preferences JSONB DEFAULT '{
        "theme": "dark",
        "fontSize": 14,
        "editorTheme": "monokai",
        "autoSave": true
    }',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    last_ip INET
);

-- Create sessions table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
CREATE INDEX idx_users_compilations ON users(compilations_today);
CREATE INDEX idx_session_expire ON session(expire);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to reset daily compilations
CREATE OR REPLACE FUNCTION reset_daily_compilations()
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET compilations_today = 0,
        last_compilation_reset = NOW()
    WHERE last_compilation_reset < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO users (username, email, password_hash, tier) VALUES 
('admin', 'admin@compiler.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQLZ/Hp0i', 'enterprise'),
('testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NQLZ/Hp0i', 'free');

-- Create view for user analytics
CREATE VIEW user_analytics AS
SELECT 
    tier,
    COUNT(*) as user_count,
    AVG(total_compilations) as avg_compilations,
    SUM(compilations_today) as today_compilations
FROM users
GROUP BY tier;