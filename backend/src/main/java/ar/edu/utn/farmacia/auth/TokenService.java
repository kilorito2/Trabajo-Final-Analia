package ar.edu.utn.farmacia.auth;

import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TokenService {

  private final JwtEncoder jwtEncoder;
  private final JwtProperties propiedades;
  private final Clock clock;

  public TokenEmitido emitir(Long usuarioId) {
    Instant ahora = clock.instant();
    Instant expira = ahora.plus(propiedades.duracion());
    // Solo lo necesario: ni rol ni datos personales. Los permisos se leen de la base.
    JwtClaimsSet claims =
        JwtClaimsSet.builder()
            .issuer(JwtProperties.EMISOR)
            .subject(usuarioId.toString())
            .issuedAt(ahora)
            .expiresAt(expira)
            .build();
    // Sin el header explícito, Nimbus intenta firmar con RS256 y falla.
    JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
    String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    return new TokenEmitido(token, expira);
  }

  public record TokenEmitido(String token, Instant expiraEn) {}
}
