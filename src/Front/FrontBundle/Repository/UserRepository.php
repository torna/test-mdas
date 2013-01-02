<?php

namespace Front\FrontBundle\Repository;

use Doctrine\ORM\EntityRepository;

abstract class UserRepository extends EntityRepository {

    /**
     * checks if email exists in DB
     * @return type
     */
    public function checkEmailExists($email) {
        $query = "SELECT COUNT(id) AS cnt FROM students WHERE email=:email";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
        $result_students = $q->fetch(2);

        $query = "SELECT COUNT(id) AS cnt FROM teachers WHERE email=:email";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
        $result_teachers = $q->fetch(2);

        return $result_students['cnt'] + $result_teachers['cnt'];
    }

    /**
     * checks if hash exists in DB
     * @return type
     */
    public function checkHashExists($hash) {
        $return = false;

        $query = "SELECT COUNT(id) AS hash_exists, 'student' AS registration_type FROM students WHERE activation_hash=:hash AND is_activated=0";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':hash' => $hash));
        $result_students = $q->fetch(2);

        $query = "SELECT COUNT(id) AS hash_exists, 'teacher' AS registration_type FROM teachers WHERE activation_hash=:hash AND is_activated=0";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':hash' => $hash));
        $result_teachers = $q->fetch(2);

        if ($result_students['hash_exists']) {
            $return = $result_students;
        } elseif ($result_teachers['hash_exists']) {
            $return = $result_teachers;
        }

        return $return;
    }

    /**
     * activated email
     * @return type
     */
    public function actiavateHash($hash) {
        $query = "UPDATE students SET is_activated=1 WHERE activation_hash=:hash";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':hash' => $hash));

        $query = "UPDATE teachers SET is_activated=1 WHERE activation_hash=:hash";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':hash' => $hash));
    }

    /**
     * 
     * @return type
     */
    public function setHasCompletedProfile($user_id) {
        $query = "UPDATE " . $this->getTableName() . " SET has_completed_profile=1 WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':id' => $user_id));
    }

    /**
     * create a user for the first step
     * @param string $email
     * @param string $pass
     * @param int $package_id
     */
    public function createUser($email, $pass) {
        $query = "
            INSERT INTO " . $this->getTableName() . "(email, pass, activation_hash, added)
            VALUES(:email, :pass, :activation_hash, NOW())
        ";


        $params = array(
            ':email' => $email,
            ':pass' => $pass,
            ':activation_hash' => md5($email . $pass . $this->getTableName() . rand(0, 9000)),
        );
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $params);
        $params[':last_insert_id'] = $this->getEntityManager()->getConnection()->lastInsertId();

        return $params;
    }

    /**
     * returns secret_hash by email
     * @param string $email
     * @return type
     */
    public function getSecretHashByEmail($email) {
        $return = array();

        $query = "
            SELECT 'student' AS registration_type, activation_hash, is_activated
            FROM students 
            WHERE email=:email
        ";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
        $return = $result_students = $q->fetch(2);

        if (empty($result_students)) {
            $query = "
                SELECT 'teacher' AS registration_type, activation_hash, is_activated
                FROM teachers 
                WHERE email=:email
            ";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
            $return = $result_teachers = $q->fetch(2);
        }

        return $return;
    }

    /**
     * returns password by email
     * @param string $email
     * @return type
     */
    public function getPasswordByEmail($email) {
        $return = array();

        $query = "SELECT is_activated, pass FROM students WHERE email=:email";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
        $return = $result_students = $q->fetch(2);

        if (empty($result_students)) {
            $query = "SELECT is_activated, pass FROM teachers WHERE email=:email";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $email));
            $return = $result_teachers = $q->fetch(2);
        }

        return $return;
    }

    /**
     * returns user by email+password
     * @param string $login_email
     * @param string $login_pass
     * @return type
     */
    public function getUserAuth($login_email, $login_pass) {
        $return = array();

        $query = "SELECT *, 'student' as account_type FROM students WHERE email=:email AND pass=:pass";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $login_email, ':pass' => $login_pass));
        $result_students = $q->fetch(2);
        $return = $result_students;

        if (empty($result_students)) {
            $query = "SELECT *, 'teacher' as account_type FROM teachers WHERE email=:email AND pass=:pass";
            $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':email' => $login_email, ':pass' => $login_pass));
            $result_teachers = $q->fetch(2);
            $return = $result_teachers;
        }

        return $return;
    }

    /**
     * for step 3 registration: adds more user data in db
     * @param integer $id
     * @param string $f_name
     * @param string $l_name
     * @return type
     */
    public function addUserData($id, $params) {
        $query_params = $set = array();

        foreach ($params as $key => $value) {
            $set[] = $key . '=' . ':'.$key;
            $query_params[':'.$key] = $value;
        }
        $query_params[':id'] = $id;
        
        $query = "UPDATE ".$this->getTableName()." SET ".implode(', ', $set)." WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, $query_params);
    }

    public function updateUserPassword($id, $new_pass) {
        $query = "UPDATE user SET pass=:new_pass WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':new_pass' => $new_pass, ':id' => $id));
    }

    public function updateUserDateFormat($id, $new_format) {
        $query = "UPDATE user SET user_date_format=:new_format WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':new_format' => $new_format, ':id' => $id));
    }

    public function deleteAllUserData($id) {
        $query = "UPDATE user SET is_deleted=1 WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':id' => $id));
    }

    public function updateLastLogin($id) {
        $query = "UPDATE " . $this->getTableName() . " SET last_login=NOW() WHERE id=:id";
        $q = $this->getEntityManager()->getConnection()->executeQuery($query, array(':id' => $id));
    }

    abstract public function getTableName();
}