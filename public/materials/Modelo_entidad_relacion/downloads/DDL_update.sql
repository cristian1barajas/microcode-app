-- MySQL Workbench Synchronization
-- Generated: 2021-06-15 13:59
-- Model: New Model
-- Version: 1.0
-- Project: Name of the project
-- Author: sena

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

ALTER TABLE `farmacia`.`factura` 
DROP FOREIGN KEY `fk_factura_compania1`,
DROP FOREIGN KEY `fk_factura_termino1`;

ALTER TABLE `farmacia`.`factura` 
CHARACTER SET = utf8 , COLLATE = utf8_general_ci ,
ADD COLUMN `sub_total` FLOAT(11) NOT NULL AFTER `hora`,
ADD COLUMN `tasa_impuesto` FLOAT(11) NOT NULL AFTER `sub_total`;

ALTER TABLE `farmacia`.`factura` 
DROP FOREIGN KEY `fk_factura_persona`;

ALTER TABLE `farmacia`.`factura` ADD CONSTRAINT `fk_factura_persona`
  FOREIGN KEY (`id_persona`)
  REFERENCES `farmacia`.`persona` (`id_persona`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_factura_compania1`
  FOREIGN KEY (`id_compania`)
  REFERENCES `farmacia`.`compania` (`id_compania`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION,
ADD CONSTRAINT `fk_factura_termino1`
  FOREIGN KEY (`id_termino`)
  REFERENCES `farmacia`.`termino` (`id_termino`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
