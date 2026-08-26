package net.refound.api;

import org.springframework.boot.SpringApplication;

public class TestRefoundApplication {

	public static void main(String[] args) {
		SpringApplication.from(RefoundApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
