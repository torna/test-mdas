<?php

namespace Front\FrontBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * SystemSubjectsCategories
 */
class SystemSubjectsCategories
{
    /**
     * @var integer
     */
    private $id;

    /**
     * @var string
     */
    private $objectCategoryRo;

    /**
     * @var string
     */
    private $objectCategoryRu;

    /**
     * @var string
     */
    private $objectCategoryEn;

    /**
     * @var integer
     */
    private $isActive;

    /**
     * @var \DateTime
     */
    private $added;


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
     * Set objectCategoryRo
     *
     * @param string $objectCategoryRo
     * @return SystemSubjectsCategories
     */
    public function setObjectCategoryRo($objectCategoryRo)
    {
        $this->objectCategoryRo = $objectCategoryRo;
    
        return $this;
    }

    /**
     * Get objectCategoryRo
     *
     * @return string 
     */
    public function getObjectCategoryRo()
    {
        return $this->objectCategoryRo;
    }

    /**
     * Set objectCategoryRu
     *
     * @param string $objectCategoryRu
     * @return SystemSubjectsCategories
     */
    public function setObjectCategoryRu($objectCategoryRu)
    {
        $this->objectCategoryRu = $objectCategoryRu;
    
        return $this;
    }

    /**
     * Get objectCategoryRu
     *
     * @return string 
     */
    public function getObjectCategoryRu()
    {
        return $this->objectCategoryRu;
    }

    /**
     * Set objectCategoryEn
     *
     * @param string $objectCategoryEn
     * @return SystemSubjectsCategories
     */
    public function setObjectCategoryEn($objectCategoryEn)
    {
        $this->objectCategoryEn = $objectCategoryEn;
    
        return $this;
    }

    /**
     * Get objectCategoryEn
     *
     * @return string 
     */
    public function getObjectCategoryEn()
    {
        return $this->objectCategoryEn;
    }

    /**
     * Set isActive
     *
     * @param integer $isActive
     * @return SystemSubjectsCategories
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
     * @return SystemSubjectsCategories
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
}
