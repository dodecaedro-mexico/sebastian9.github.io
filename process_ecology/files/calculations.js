$('#vertical-separator').submit(function(event) {
    
    // Input Variables
    var P = Number( $("#P").val() );
    var K_S = Number( $("#K_S").val() );
    var rho_LL = Number( $("#rho_LL").val() );
    var rho_HL = Number( $("#rho_HL").val() );
    var rho_V = Number( $("#rho_V").val() );
    var W_V = Number( $("#W_V").val() );
    var W_LL = Number( $("#W_LL").val() );
    var W_HL = Number( $("#W_HL").val() );
    var mu_LL = Number( $("#mu_LL").val() );
    var mu_HL = Number( $("#mu_HL").val() );
    var G = Number( $("#G").val() );
    var T_H = Number( $("#T_H").val() );
    var T_S = Number( $("#T_S").val() );
    var mist_eliminator = $("#mist_eliminator").prop('checked');
    var baffle_plate = $("#baffle_plate").prop('checked');

    // Assumed Dimensions

    var H_LL = Number( $("#H_LL").val() );
    var H_HL = Number( $("#H_HL").val() );
    var H_R = Number( $("#H_R").val() );
    var H_A = Number( $("#H_A").val() );
    var W_D = Number( $("#W_D").val() );

    // Derived Variables

    var K_V = 0.430-0.023*Math.log(P);

    // Calculations

    //1 Calculate the vertical terminal vapor velocity
    U_T = K_V*Math.pow(((rho_LL-rho_V)/rho_V),0.5); // in/min
    // For a conservative design
    U_V = 0.75*U_T; // in/min

    //2 Calculate the vapor volumetric flow rate
    Q_V = W_V/(3600*rho_V); // [ft3/s]

    //3 Calculate the vessel internal diameter
    D_VD = Math.pow(4*Q_V/(Math.PI*U_V),0.5); // [ft]

    if (mist_eliminator) {
      D_VD = D_VD - D_VD%0.5 + 0.5; // [ft]
    }

    D = D_VD // [ft]

    //4 Calculate the setttling velocity of the heavy liquid out of the light liquid using Stoke's Law
    U_HL = K_S * (rho_HL - rho_LL) / mu_LL; // [in/min]

    //5 Calculate the rising velocity of the light liquid of the heavy liquid using Stoke's Law
    U_LL = K_S * (rho_HL - rho_LL) / mu_HL; // [in/min]

    //6 Calculate the light and heavy liquid volumetric flow rates 

    Q_HL = W_HL/(60*rho_HL); // [ft3/min]
    Q_LL = W_LL/(60*rho_LL); // [ft3/min]

    //7 Calculate the settling time for the heavy liquid droplets to settle
    t_LL = 12*H_LL/U_HL

    //8 Calculate the settling time for the light liquid droplets to rise
    t_HL = 12*H_HL/U_LL

    // Loop initialization variables
    var i = 0;
    var theta_HL = 0;
    var theta_LL = 0;

    // Loop to find appropiate diameter
    while (theta_LL < t_LL || theta_HL < t_HL && i < 400) {
      D = D + D*i/200; // Increase the diameter half a percent each iteration [ft]
      A = (0.25*Math.PI*D**2); // [ft2]
      i = i+1; // Current iteration

      //9 Calculate baffle plate area

      if (baffle_plate) {
        //d From allowable downflow and volumetric flow rates  
        A_D = 7.48*60*(Q_LL+Q_HL)/G; // Equation I3 [ft2] 
        //f Calculate ratio
        x = W_D/D; 

        // table 3 coefficients for cylindrical height and area conversions
        var f = {
          'a' : -4.755930e-5,
          'b' : 3.924091,
          'c' : 0.174875,
          'd' : -6.358805,
          'e' : 5.668973,
          'f' : 4.018448,
          'g' : -4.916411,
          'h' : -1.801705,
          'i' : -0.145348
        };

        //i Calculate the area of discharge A_D

        A_D = A * (f.a + f.c*x + Math.pow(f.e*x,2) + Math.pow(f.g*x,3) + Math.pow(f.i*x,4))/(1 + f.b*x + Math.pow(f.d*x,2) + Math.pow(f.f*x,3) + Math.pow(f.h*x,4));

        //j Calculate the area of the baffle 
        A_LL = A - A_D; // [ft2]
      } else {
        A_LL = A;
      }

      //10 Calculate the residence time of each phase based on the volumes occupied by the light and heavy phases

      theta_LL = H_LL * A_LL / Q_LL;
      theta_HL = H_HL * A / Q_HL;

    }
    
    //11 Calculate the heigh of the light liquid above the outlet (holdup height) based on the requited holdup
    H_R = Q_LL * T_H / A_LL; // [ft] check with assumption in step 9b
    H_S = (Q_LL + Q_HL) * T_S / A; // [ft]

    //12 Calculate the vessel height using the guidelines

    // Calculate Inlet Nozzle Sizing d_N according to table 5
    Q_L = (Q_LL + Q_HL)/60; // Liquid volumetric flow rate [ft3/s]
    Q_M = Q_L + Q_V; // Mix volumetric flow rate [ft3/s]
    lmbd = Q_L/Q_M; // Flow rates ratio
    rho_L = rho_LL*(Q_LL/60)/Q_L + rho_HL*(Q_HL/60)/Q_L; // Liquid mix density [lb/ft3]
    rho_M = rho_L*lmbd + rho_V*(1-lmbd); // Mix density [lb/ft3]

    d_N = Math.sqrt((4*Math.sqrt(Q_M*rho_M))/(60*Math.PI)); // Inlet nozzle size [ft]

    // Half the nozzle size plus the greater of 2 ft or H_S + 0.5 ft
    H_BN = 0.5*d_N + (2>(H_S+0.5))*2 + (2<(H_S+0.5))*(H_S+0.5);

    if (!(mist_eliminator)) {
      H_D = ( 0.5*D > ((36/12) +  0.5*d_N) ) * 0.5*D + ( 0.5*D < ((36/12) +  0.5*d_N) )*((36/12) +  0.5*d_N);
      H_mist = 0;
    } else {
      H_D = ( 0.5*D > ((24/12) +  0.5*d_N) ) * 0.5*D + ( 0.5*D < ((24/12) +  0.5*d_N) )*((24/12) +  0.5*d_N);
      H_mist = 1.5;
    }

    H_total = H_HL + H_LL + H_R + H_A + H_BN + H_D + H_mist;

    $("#D").val( D_VD.toFixed(2) );
    $("#H_BN").val( H_BN.toFixed(2) );
    $("#H_D").val( H_D.toFixed(2) );
    $("#d_N").val( d_N.toFixed(2) );
    $("#A_LL").val( A_LL.toFixed(2) );
    $("#H_total").val( H_total.toFixed(2) );

    event.preventDefault();

    // Horizontal Design Procedure No Boot Weir

    //4 Calculate the holdup and surge volumes

    var V_H = T_H*Q_L // Holdup Volume [ft3]
    var V_S = T_S*Q_L // Surge Volume [ft3]

    //5 Obtain an L/D from table 7 and initially calculate the diameter

    if (P <= 250) {
        L_D = 2.25;
    } else if (P > 250 && P <= 500) {
        L_D = 3.5;
    } else {
        L_D = 5;
    }

    D = Math.pow( 4*(V_H+V_S)/(0.5*Math.PI*L_D) , 3 );

    alert(D)

  });