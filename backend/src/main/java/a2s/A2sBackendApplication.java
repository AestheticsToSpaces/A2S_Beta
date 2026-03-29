package a2s;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class A2sBackendApplication {

	public static void main(String[] args) {
		System.setProperty("dotenv.location", "../.env");
		SpringApplication.run(A2sBackendApplication.class, args);
	}

}
