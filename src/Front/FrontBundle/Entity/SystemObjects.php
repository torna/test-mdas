<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * SystemObjects
 */
class SystemObjects
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $objectRo;

    /**
     * @var string
     */
    private $objectRu;

    /**
     * @var string
     */
    private $objectEn;

    /**
     * @var integer
     */
    private $isActive;

    /**
     * @var \DateTime
     */
    private $added;

    /**
     * @var \Front\FrontBundle\Entity\SystemSubjectsCategories
     */
    private $objectCategory;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set objectRo
     *
     * @param string $objectRo
     * @return SystemObjects
     */
    public function setObjectRo($objectRo)
    {
        $this->objectRo = $objectRo;
    
        return $this;
    }

    /**
     * Get objectRo
     *
     * @return string 
     */
    public function getObjectRo()
    {
        return $this->objectRo;
    }

    /**
     * Set objectRu
     *
     * @param string $objectRu
     * @return SystemObjects
     */
    public function setObjectRu($objectRu)
    {
        $this->objectRu = $objectRu;
    
        return $this;
    }

    /**
     * Get objectRu
     *
     * @return string 
     */
    public function getObjectRu()
    {
        return $this->objectRu;
    }

    /**
     * Set objectEn
     *
     * @param string $objectEn
     * @return SystemObjects
     */
    public function setObjectEn($objectEn)
    {
        $this->objectEn = $objectEn;
    
        return $this;
    }

    /**
     * Get objectEn
     *
     * @return string 
     */
    public function getObjectEn()
    {
        return $this->objectEn;
    }

    /**
     * Set isActive
     *
     * @param integer $isActive
     * @return SystemObjects
     */
    public function setIsActive($isActive)
    {
        $this->isActive = $isActive;
    
        return $this;
    }

    /**
     * Get isActive
     *
     * @return integer 
     */
    public function getIsActive()
    {
        return $this->isActive;
    }

    /**
     * Set added
     *
     * @param \DateTime $added
     * @return SystemObjects
     */
    public function setAdded($added)
    {
        $this->added = $added;
    
        return $this;
    }

    /**
     * Get added
     *
     * @return \DateTime 
     */
    public function getAdded()
    {
        return $this->added;
    }

    /**
     * Set objectCategory
     *
     * @param \Front\FrontBundle\Entity\SystemSubjectsCategories $objectCategory
     * @return SystemObjects
     */
    public function setObjectCategory(\Front\FrontBundle\Entity\SystemSubjectsCategories $objectCategory = null)
    {
        $this->objectCategory = $objectCategory;
    
        return $this;
    }

    /**
     * Get objectCategory
     *
     * @return \Front\FrontBundle\Entity\SystemSubjectsCategories 
     */
    public function getObjectCategory()
    {
        return $this->objectCategory;
    }
}
