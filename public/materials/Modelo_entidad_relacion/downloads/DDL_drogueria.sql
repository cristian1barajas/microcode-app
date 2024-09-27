-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema farmacia
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema farmacia
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `farmacia` DEFAULT CHARACTER SET utf8 ;
USE `farmacia` ;

-- -----------------------------------------------------
-- Table `farmacia`.`persona`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`persona` (
  `id_persona` INT NOT NULL,
  `identificacion` VARCHAR(45) NOT NULL,
  `nombres` VARCHAR(450) NOT NULL,
  `direccion` VARCHAR(250) NULL,
  `ciudad` VARCHAR(80) NULL,
  `codigo_postal` VARCHAR(15) NULL,
  `telefono` VARCHAR(15) NULL,
  `correo` VARCHAR(250) NULL,
  PRIMARY KEY (`id_persona`),
  UNIQUE INDEX `identificacion_UNIQUE` (`identificacion` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`compania`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`compania` (
  `id_compania` SMALLINT NOT NULL,
  `nit` VARCHAR(45) NOT NULL,
  `compania` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_compania`),
  UNIQUE INDEX `nit_UNIQUE` (`nit` ASC) VISIBLE)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`termino`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`termino` (
  `id_termino` TINYINT NOT NULL,
  `termino` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_termino`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`factura`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`factura` (
  `id_factura` BIGINT NOT NULL AUTO_INCREMENT,
  `id_persona` INT NOT NULL,
  `id_compania` SMALLINT NULL,
  `id_termino` TINYINT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL,
  PRIMARY KEY (`id_factura`),
  INDEX `fk_factura_persona_idx` (`id_persona` ASC) VISIBLE,
  INDEX `fk_factura_compania1_idx` (`id_compania` ASC) VISIBLE,
  INDEX `fk_factura_termino1_idx` (`id_termino` ASC) VISIBLE,
  CONSTRAINT `fk_factura_persona`
    FOREIGN KEY (`id_persona`)
    REFERENCES `farmacia`.`persona` (`id_persona`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_factura_compania1`
    FOREIGN KEY (`id_compania`)
    REFERENCES `farmacia`.`compania` (`id_compania`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_factura_termino1`
    FOREIGN KEY (`id_termino`)
    REFERENCES `farmacia`.`termino` (`id_termino`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`categoria`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`categoria` (
  `id_categoria` SMALLINT NOT NULL AUTO_INCREMENT,
  `categoria` VARCHAR(150) NOT NULL,
  PRIMARY KEY (`id_categoria`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`producto` (
  `id_producto` INT NOT NULL AUTO_INCREMENT,
  `id_categoria` SMALLINT NOT NULL,
  `producto` VARCHAR(150) NOT NULL,
  `existencia` INT NOT NULL DEFAULT 0,
  `valor_unitario_venta` FLOAT NOT NULL,
  `valor_unitario_compra` FLOAT NOT NULL,
  PRIMARY KEY (`id_producto`),
  INDEX `fk_producto_categoria1_idx` (`id_categoria` ASC) VISIBLE,
  CONSTRAINT `fk_producto_categoria1`
    FOREIGN KEY (`id_categoria`)
    REFERENCES `farmacia`.`categoria` (`id_categoria`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `farmacia`.`factura_producto`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `farmacia`.`factura_producto` (
  `id_factura` BIGINT NOT NULL,
  `id_producto` INT NOT NULL,
  `valor_unitario` FLOAT NOT NULL,
  `cantidad` SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id_factura`, `id_producto`),
  INDEX `fk_factura_has_producto_producto1_idx` (`id_producto` ASC) VISIBLE,
  INDEX `fk_factura_has_producto_factura1_idx` (`id_factura` ASC) VISIBLE,
  CONSTRAINT `fk_factura_has_producto_factura1`
    FOREIGN KEY (`id_factura`)
    REFERENCES `farmacia`.`factura` (`id_factura`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_factura_has_producto_producto1`
    FOREIGN KEY (`id_producto`)
    REFERENCES `farmacia`.`producto` (`id_producto`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
